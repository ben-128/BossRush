Shader "Sprites/MultiplySubtle"
{
    Properties
    {
        [PerRendererData] _MainTex ("Sprite Texture", 2D) = "white" {}
        _Color ("Tint", Color) = (1,1,1,1)
        _MultiplyStrength ("Multiply Strength", Range(0,1)) = 0.12
        [MaterialToggle] PixelSnap ("Pixel snap", Float) = 0
    }

    SubShader
    {
        Tags
        {
            "Queue"="Transparent"
            "IgnoreProjector"="True"
            "RenderType"="Transparent"
            "PreviewType"="Plane"
            "CanUseSpriteAtlas"="True"
        }

        Cull Off
        Lighting Off
        ZWrite Off

        GrabPass { "_GrabBG" }

        Pass
        {
            Blend SrcAlpha OneMinusSrcAlpha

            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ PIXELSNAP_ON
            #include "UnityCG.cginc"

            struct appdata_t
            {
                float4 vertex   : POSITION;
                float4 color    : COLOR;
                float2 texcoord : TEXCOORD0;
            };

            struct v2f
            {
                float4 vertex   : SV_POSITION;
                fixed4 color    : COLOR;
                float2 texcoord : TEXCOORD0;
                float4 grabPos  : TEXCOORD1;
            };

            sampler2D _MainTex;
            sampler2D _GrabBG;
            fixed4 _Color;
            half _MultiplyStrength;

            v2f vert(appdata_t IN)
            {
                v2f OUT;
                OUT.vertex = UnityObjectToClipPos(IN.vertex);
                OUT.texcoord = IN.texcoord;
                OUT.color = IN.color * _Color;
                OUT.grabPos = ComputeGrabScreenPos(OUT.vertex);
                #ifdef PIXELSNAP_ON
                OUT.vertex = UnityPixelSnap(OUT.vertex);
                #endif
                return OUT;
            }

            fixed4 frag(v2f IN) : SV_Target
            {
                fixed4 sprite = tex2D(_MainTex, IN.texcoord) * IN.color;
                fixed4 bg = tex2Dproj(_GrabBG, IN.grabPos);

                // Multiply modulated by alpha: transparent = no effect
                sprite.rgb = lerp(sprite.rgb, sprite.rgb * bg.rgb, _MultiplyStrength * sprite.a);

                return sprite;
            }
            ENDCG
        }
    }
}
